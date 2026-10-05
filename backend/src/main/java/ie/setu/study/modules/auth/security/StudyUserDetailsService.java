package ie.setu.study.modules.auth.security;

import ie.setu.study.modules.user.model.StudyUser;
import ie.setu.study.modules.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class StudyUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public StudyUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        StudyUser user = userRepository.findByEmail(username.toLowerCase())
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new StudyUserDetails(user);
    }
}
